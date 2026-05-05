'use strict';

/**
 * TST-B2: bcrypt helper unit tests
 * Tests bcrypt usage patterns as used in the controllers.
 * bcrypt is not wrapped in a helper — testing its patterns directly.
 */

const bcrypt = require('bcrypt');

describe('bcrypt usage patterns', () => {
  const password = 'SuperSecret123';
  const saltRounds = 10;

  test('1. hashSync produces different hashes for the same password (bcrypt is salted)', () => {
    const salt1 = bcrypt.genSaltSync(saltRounds);
    const salt2 = bcrypt.genSaltSync(saltRounds);
    const hash1 = bcrypt.hashSync(password, salt1);
    const hash2 = bcrypt.hashSync(password, salt2);

    // Two separate salts must yield different hashes
    expect(hash1).not.toBe(hash2);
  });

  test('2. compareSync returns true for the correct password', () => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    expect(bcrypt.compareSync(password, hash)).toBe(true);
  });

  test('3. compareSync returns false for a wrong password', () => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    expect(bcrypt.compareSync('WrongPassword!', hash)).toBe(false);
  });

  test('4. hash is not stored as plain text (length > 20)', () => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    // bcrypt hashes are 60 characters long; anything > 20 confirms it is hashed
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toBe(password);
  });
});
