const user = require("../models/User");
const bcrypt = require("bcryptjs")

const {loginUser} = require("../services/user/authServices");
jest.mock("../models/User")
jest.mock("bcryptjs")
jest.mock("../utils/generateToken", () => jest.fn());

describe("login user",()=>{

    test("successfull login when only the input credentials are valid",async ()=>{
        const fakeUser={
        _id:"123",
        name:"nihala",
        email:"nihala@gmail.com",
        password:"hashedpassword",
        isActive: true,
         isVerified: true
        };

        user.findOne.mockResolvedValue(fakeUser)
        bcrypt.compare.mockResolvedValue(true)

        const result = await loginUser({
            email:"niha@gmil.com",
            password:"hash",
        });

        expect(result.message).toBe("Login successful");
        expect(result.user.name).toBe("nihala");
    })
})