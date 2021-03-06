import { ICommentInput } from "types/services/Comment";
import Container, { Service, Inject } from "typedi";
import { PostStatic } from "models/post";
import { UserStatic } from "models/user";
import { CommentStatic, ICommentModel } from "models/comment";
import database from "models";
import { raw } from "express";

interface IReactionService {
    getComments: (postId: string) => Promise<ICommentModel[]>;
    createComment: (postId: string, comment: ICommentInput) => Promise<ICommentModel>;
}

@Service()
class ReactionService implements IReactionService {
    @Inject() private _userModel: UserStatic;
    @Inject() private _postModel: PostStatic;
    @Inject() private _commentModel: CommentStatic;
    constructor(_userModel: UserStatic, _postModel: PostStatic, _commentModel: CommentStatic) {
        this._userModel = _userModel;
        this._postModel = _postModel;
        this._commentModel = _commentModel;
    }
    public getComments = async (postId: string) => {
        try {
            await this._checkHasPost(postId);
            const comments = await this._commentModel.findAll({ where: { postId }, raw: true });
            if (comments.length) {
                return comments;
            } else {
                throw new Error("존재하는 댓글이 없습니다.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public createComment = async (postId: string, commentInput: ICommentInput) => {
        try {
            const exPost = await this._checkHasPost(postId);
            const comment = await this._commentModel.create({ ...commentInput, postId });
            await exPost.addComment(comment);
            const newComment = await this._commentModel.findOne({
                where: { id: comment.get("id") },
                include: [
                    {
                        model: database.User,
                        attributes: ["id", "nickname"]
                    }
                ]
            });
            if (newComment) {
                return newComment;
            } else {
                throw new Error("댓글 작성에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public updateComment = async (commentId: string, commentInput: ICommentInput) => {
        try {
            const { description, userId } = commentInput;
            const comment = await this._checkHasComment(commentId);
            await this._checkHasPermission(userId, comment.UserId);
            const [isUpdated] = await database.Comment.update({ description }, { where: { id: commentId } });
            return !!isUpdated;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public deleteComment = async (commentId: string, userId: string) => {
        try {
            const comment = await this._checkHasComment(commentId);
            await this._checkHasPermission(userId, comment.UserId);
            const isDeleted = await database.Comment.destroy({ where: { id: commentId } });
            return isDeleted;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public createReComment = async () => {
        try {
            const comment = await database.Comment.findOne({
                where: { id: comment_id }
            });
            if (!comment) return new Error("댓글이 존재하지 않습니다.");
            const newReComment = database.Comment.create({
                description: description,
                UserId: user.id,
                PostId: post_id,
                RecommentId: comment_id
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public createLike = async (postId: string, userId: string) => {
        try {
            const exPost = await this._checkHasPost(postId);
            await exPost.addLiker(userId);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public deleteLike = async (postId: string, userId: string) => {
        try {
            const exPost = await this._checkHasPost(postId);
            await exPost.removeLiker(userId);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    private _checkHasPost = async (postId: string) => {
        try {
            const hasPost = await this._postModel.findOne({ where: { id: postId } });
            if (hasPost) {
                return hasPost;
            } else {
                throw new Error("포스트가 존재하지 않습니다.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    private _checkHasComment = async (commentId: string) => {
        try {
            const hasComment = await this._commentModel.findOne({ where: { id: commentId } });

            if (hasComment) {
                return hasComment;
            } else {
                throw new Error("댓글이 존재하지 않습니다.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    private _checkHasPermission = async (id: string, commentUserId: string) => {
        try {
            if (id === commentUserId) {
                return true;
            } else {
                throw new Error("해당 댓글에 대한 권한이 없습니다.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };
}

Container.set(ReactionService, new ReactionService(database.User, database.Post, database.Comment));

export default ReactionService;
