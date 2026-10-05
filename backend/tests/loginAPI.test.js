const request = require("supertest");
const app = require("../server");

test("should accept valid password",async ()=>{
const response = await request(app).post("/api/auth/login")
.send({
        email:"test@gmail.com",
        password:"Password@123"
    });

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("message");
})