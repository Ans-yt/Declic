import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
// Read from stdin so credentials never enter shell history or command-line arguments.
const reader = createInterface({ input: process.stdin, terminal: false });
process.stderr.write('Enter a password (12+ characters), then press Enter. Only its salted hash will be printed.\n');
reader.once('line', value => { if(value.length < 12 || value.length > 300) { process.stderr.write('Use between 12 and 300 characters.\n'); process.exitCode=1; } else { const salt=randomBytes(16).toString('hex'); process.stdout.write('scrypt:'+salt+':'+scryptSync(value,salt,64).toString('hex')+'\n'); } reader.close(); });
