import * as Lint from 'tslint';
import chalk from 'chalk';
import * as logSymbols from 'log-symbols';

class FailureGroup {
  public failures: Lint.RuleFailure[];

  constructor(public filename: string) {
    this.failures = [];
  }

  add(failure: Lint.RuleFailure): void {
    this.failures.push(failure);
  }

  public get warningCount(): number {
    return this.getCountForSeverity('warning');
  }

  public get errorCount(): number {
    return this.getCountForSeverity('error');
  }

  public get fixCount(): number {
    return this.failures.reduce(
      (count, failure) => (failure.hasFix() ? count + 1 : count),
      0
    );
  }

  private getCountForSeverity(severity: Lint.RuleSeverity): number {
    return this.failures.reduce(
      (count, failure) =>
        failure.getRuleSeverity() === severity ? count + 1 : count,
      0
    );
  }
}

class GroupedFailures {
  public groups: {
    [fileName: string]: FailureGroup | undefined;
  };

  constructor(failures: Lint.RuleFailure[]) {
    this.groups = {};
    failures.forEach((failure: Lint.RuleFailure) => this.addFailure(failure));
  }

  public addFailure(failure: Lint.RuleFailure): void {
    const filename = failure.getFileName();
    let group = this.groups[filename];

    if (!group) {
      this.groups[filename] = group = new FailureGroup(filename);
    }

    group.add(failure);
  }

  public get warningCount(): number {
    return this.reduce((count, group) => count + group.warningCount, 0);
  }

  public get errorCount(): number {
    return this.reduce((count, group) => count + group.errorCount, 0);
  }

  public get fixCount(): number {
    return this.reduce((count, group) => count + group.fixCount, 0);
  }

  public reduce<V>(
    callbackfn: (previousValue: V, group: FailureGroup) => V,
    initialValue: V
  ): V {
    return Object.keys(this.groups).reduce((previousValue, filename) => {
      const group = this.groups[filename];
      return group ? callbackfn(previousValue, group) : previousValue;
    }, initialValue);
  }
}

export class Formatter extends Lint.Formatters.AbstractFormatter {
  protected sortFailures(failures: Lint.RuleFailure[]): Lint.RuleFailure[] {
    return failures.sort((a, b) => {
      const {
        line: lineA,
        character: characterA,
      } = a.getStartPosition().getLineAndCharacter();
      const {
        line: lineB,
        character: characterB,
      } = b.getStartPosition().getLineAndCharacter();
      const filenameA = a.getFileName();
      const filenameB = b.getFileName();

      if (filenameA === filenameB) {
        return lineA === lineB ? characterA - characterB : lineA - lineB;
      }

      return filenameA < filenameB ? -1 : filenameA > filenameB ? 1 : 0;
    });
  }

  public format(failures: Lint.RuleFailure[]): string {
    const failuresByFile = new GroupedFailures(this.sortFailures(failures));

    return `${getDetails(failuresByFile)}\n${getSummary(failuresByFile)}`;
  }
}

function formatFailure(failure: Lint.RuleFailure): string {
  const {line, character} = failure.getStartPosition().getLineAndCharacter();
  const position = `${line + 1}:${character + 1}`;
  const message = failure.getFailure();
  const ruleName = failure.getRuleName();
  const severity = failure.getRuleSeverity();
  const severityColor = severity === 'warning' ? chalk.yellow : chalk.red;
  const fixHint = failure.hasFix() ? ` ${logSymbols.info}` : '';

  return `  ${severityColor(severity)}: ${chalk.blue(position)} ${message} ${chalk.dim(
    ruleName
  )}${fixHint}`;
}

function getDetails(failures: GroupedFailures): string {
  return failures.reduce((current, group) => {
    const headline = chalk.underline.green(group.filename);
    const formattedFailures = group.failures.map(formatFailure).join('\n');

    return `${current}\n${headline}\n${formattedFailures}\n`;
  }, '');
}

function getSummary(failures: GroupedFailures): string {
  const {warningCount, errorCount, fixCount} = failures;
  const issueCount = warningCount + errorCount;

  const warnings = getCountText('warning', warningCount);
  const errors = getCountText('error', errorCount);
  const status = getStatusSymbol(warningCount, errorCount);
  const summary = `${status} Found ${warnings} and ${errors}.`;

  return issueCount === 0
    ? summary
    : `${summary}\n${getFixableHint(issueCount, fixCount)}\n`;
}

function getFixableHint(issueCount: number, fixCount: number): string {
  const issues = getCountText('issue', issueCount);

  return `${logSymbols.info} ${fixCount} out of ${issues} ${
    fixCount === 1 ? 'is' : 'are'
  } fixable with the tslint option \`--fix\`.`;
}

function getCountText(word: string, count: number): string {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function getStatusSymbol(warningCount: number, errorCount: number): string {
  if (errorCount > 0) {
    return logSymbols.error;
  }

  if (warningCount > 0) {
    return logSymbols.warning;
  }

  return logSymbols.success;
}
