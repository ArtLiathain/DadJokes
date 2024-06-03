import {
  verifyAccessToken,
  extractJwtClaims,
  generateAccessToken,
} from "../JwtAuth";
describe("JWT tests", () => {
  test("Generate and verify a token", () => {
    const token = generateAccessToken("12345678910");
    expect(verifyAccessToken(token).success).toBe(true);
  });

  test("Generate and extract JWT claims", () => {
    const token = generateAccessToken("12345678910");
    expect(extractJwtClaims(token).publickey).toBe("12345678910");
  });

});
