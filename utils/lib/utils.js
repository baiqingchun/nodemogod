
exports.remove_ids = function (list) {
    list.forEach(function (one) {
        delete one._id;
    });
};

