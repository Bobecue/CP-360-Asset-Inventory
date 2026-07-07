"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
let RequestsController = class RequestsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async create(body, req) {
        const user = req.headers["x-user"] || "user1";
        const data = await this.svc.create(body, user);
        return { data, message: "Request created successfully", statusCode: 201 };
    }
    async findAll(req) {
        const q = req.query || {};
        const user = req.headers["x-user"] || "user1";
        const data = await this.svc.findAll(q, user);
        return { data, message: "Requests fetched successfully", statusCode: 200 };
    }
    async getSummary(req) {
        const user = req.headers["x-user"] || "user1";
        const data = await this.svc.getSummary(user);
        return {
            data,
            message: "Summary fetched",
            statusCode: 200,
        };
    }
    async findMine(req) {
        const q = req.query || {};
        const user = req.headers["x-user"] || "user1";
        const status = q.status;
        const data = await this.svc.findMine(user, status);
        return { data, message: "My requests fetched", statusCode: 200 };
    }
    async findOne(id) {
        const data = await this.svc.findOne(id);
        return { data, message: "Request details fetched successfully", statusCode: 200 };
    }
    async approve(id, body) {
        const data = await this.svc.approve(id, body.comment, body.approverEmail);
        return { data, message: "Request approved successfully", statusCode: 200 };
    }
    async reject(id, body) {
        const data = await this.svc.reject(id, body.comment, body.approverEmail);
        return { data, message: "Request rejected successfully", statusCode: 200 };
    }
    async release(id, body) {
        const data = await this.svc.release(id, body.assetId, body.releaserEmail);
        return { data, message: "Asset released successfully", statusCode: 200 };
    }
    async returnAsset(id, body) {
        const data = await this.svc.return(id, body.comment, body.returnerEmail);
        return { data, message: "Request item returned successfully", statusCode: 200 };
    }
    async review(id, body) {
        if (body.status === "APPROVED") {
            const data = await this.svc.approve(id, body.reviewComment, body.approverEmail);
            return { data, message: "Request approved successfully", statusCode: 200 };
        }
        else {
            const data = await this.svc.reject(id, body.reviewComment, body.approverEmail);
            return { data, message: "Request rejected successfully", statusCode: 200 };
        }
    }
    async cancel(id) {
        const data = await this.svc.cancel(id);
        return { data, message: "Request cancelled successfully", statusCode: 200 };
    }
    async addComment(id, body, req) {
        const user = req.headers["x-user"] || "user1";
        const data = await this.svc.addComment(id, body.comment, user);
        return { data, message: "Comment added successfully", statusCode: 200 };
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)("mine"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)([":id/approve", ":id/approved", ":id/ready_for_pickup"]),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)([":id/reject", ":id/rejected"]),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(":id/release"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "release", null);
__decorate([
    (0, common_1.Post)([":id/return", ":id/returned"]),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "returnAsset", null);
__decorate([
    (0, common_1.Patch)(":id/review"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "review", null);
__decorate([
    (0, common_1.Patch)(":id/withdraw"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(":id/comment"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "addComment", null);
exports.RequestsController = RequestsController = __decorate([
    (0, common_1.Controller)("requests"),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map