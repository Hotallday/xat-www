var UserModel = require('../../models/user');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;
  var profileName = request.params.username;

  var opts = {
    profileName: profileName,
    isSelf: loggedInUser && profileName === loggedInUser.username
  };

  var User = UserModel.new(request);

  User.get(['xats', 'rank'], profileName, function(err, data) {
    if (err || !data) {
      return reply.redirect('/');
    }

    opts.isDeveloper = data.rank == 2;
    opts.isStaff = data.rank == 3;

    return reply.view('user/profile', opts).code(200);
  });
};