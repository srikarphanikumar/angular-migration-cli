import chalk from 'chalk';

export const theme = {
  primary: chalk.cyan.bold,
  success: chalk.green,
  successBold: chalk.green.bold,
  warning: chalk.yellow,
  error: chalk.red,
  errorBold: chalk.red.bold,
  muted: chalk.gray,
  highlight: chalk.white.underline,
  info: chalk.white,
  dim: chalk.dim,
};

export const symbols = {
  success: theme.success('✔'),
  warning: theme.warning('⚠'),
  error: theme.error('✖'),
  info: theme.primary('ℹ'),
  doc: theme.muted('-'),
};
