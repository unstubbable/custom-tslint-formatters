import * as Lint from 'tslint';
import * as chalk from 'chalk';

interface IGroupedFailures {
  [fileName: string]: Lint.RuleFailure[];
}

export class Formatter extends Lint.Formatters.AbstractFormatter {
  private formatFailure(failure: Lint.RuleFailure): string {
    const {line, character} = failure.getStartPosition().getLineAndCharacter();
    const position = `${line + 1}:${character + 1}`;
    const message = failure.getFailure();
    const ruleName = failure.getRuleName();
    return `  ${chalk.dim(position)} ${message} ${chalk.dim(ruleName)}`;
  }

  private groupByFile(failures: Lint.RuleFailure[]): IGroupedFailures {
    return failures.reduce(
      (groups: IGroupedFailures, failure: Lint.RuleFailure) => {
        const fileName = failure.getFileName();
        const fileFailures = groups[fileName] || [];
        groups[fileName] = [...fileFailures, failure];
        return groups;
      },
      {} as IGroupedFailures
    );
  }

  public format(failures: Lint.RuleFailure[]): string {
    const failuresByFile = this.groupByFile(failures);
    return Object.keys(failuresByFile)
      .reduce((lines: string[], fileName: string) => {
        lines.push(chalk.underline.yellow(fileName));
        const fileFailures = failuresByFile[fileName];
        return lines.concat(fileFailures.map(this.formatFailure), ['\n']);
      }, [])
      .join('\n');
  }
}
