function isValidPassword(password){
   const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

  return passwordRegex.test(password)

}

module.exports = isValidPassword;







