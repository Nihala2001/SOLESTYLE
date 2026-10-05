
const isValidPassword = require("../utils/passwordValidation");

describe("validate password",()=>{

test("should accept a valid password",()=>{
    expect(isValidPassword("Password@123")).toBe(true);
});

test("reject password without uppercase",()=>{
    expect(isValidPassword("password@123")).toBe(false);
})

})