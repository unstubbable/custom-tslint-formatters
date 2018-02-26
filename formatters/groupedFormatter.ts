import * as Lint from 'tslint';
import chalk from 'chalk';

interface GroupedFailures {
  [fileName: string]: Lint.RuleFailure[];
}

export class Formatter extends Lint.Formatters.AbstractFormatter {
  private formatFailure(failure: Lint.RuleFailure): string {
    const {line, character} = failure.getStartPosition().getLineAndCharacter();
    const position = `${line + 1}:${character + 1}`;
    const message = failure.getFailure();
    const ruleName = failure.getRuleName();
    const severity = failure.getRuleSeverity();
    const positionColor = severity === 'warning' ? chalk.yellow : chalk.red;
    return `  ${positionColor(position)} ${message} ${chalk.dim(ruleName)}`;
  }

  private groupByFile(failures: Lint.RuleFailure[]): GroupedFailures {
    return failures.reduce(
      (groups: GroupedFailures, failure: Lint.RuleFailure) => {
        const fileName = failure.getFileName();
        const fileFailures = groups[fileName] || [];
        groups[fileName] = [...fileFailures, failure];
        return groups;
      },
      {} as GroupedFailures
    );
  }

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
    const failuresByFile = this.groupByFile(this.sortFailures(failures));

    return Object.keys(failuresByFile)
      .reduce((lines: string[], fileName: string) => {
        lines.push(chalk.underline.green(fileName));
        const fileFailures = failuresByFile[fileName];
        return lines.concat(fileFailures.map(this.formatFailure), ['\n']);
      }, [])
      .join('\n');
  }
}
