import { loadConfig, validateConfig } from './lib/config.mjs';

const errors = validateConfig(loadConfig());

if (errors.length > 0) {
  console.error('Configuration is invalid:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('Configuration is valid.');
}
