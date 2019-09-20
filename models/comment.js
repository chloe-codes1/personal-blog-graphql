module.exports = (sequelize, DataTypes) => {
	// TABLE NAME : comments
	const Comment = sequelize.define(
		'Comment',
		{
			description: {
				type: DataTypes.TEXT,
				allowNull: false
			}
		},
		{
			charset: 'utf8',
			collate: 'utf8_general_ci',
			tableName: 'comments'
		}
	);
	Comment.associate = (db) => {
		db.Comment.belongsTo(db.User);
		db.Comment.belongsTo(db.Post);
	};
	return Comment;
};