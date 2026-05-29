const bcrypt = require('bcryptjs');
const users = require('./users.json');
const candidates = ['Afec@2024','Admin@Paynote1','Admin@2024!','password123','12345678','Paynote2024'];

(async () => {
  for (const user of users) {
    for (const candidate of candidates) {
      const ok = await bcrypt.compare(candidate, user.passwordHash);
      if (ok) {
        console.log('MATCH', user.email, candidate);
        process.exit(0);
      }
    }
  }
  console.log('NO MATCH');
})();
