"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProject = exports.deleteProject = exports.fetchSingleProjectsForClient = exports.fetchProjectsForDeveloper = exports.fetchProjectsForClient = exports.createProject = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, status, start_date, assigned_people } = req.body;
    const { id: loggedInUserId } = req.body.user;
    if (!name) {
        res.status(400).json({ message: "Please enter project name" });
        return;
    }
    try {
        // Ensure client exists
        const clientExists = yield database_1.default.user.findUnique({
            where: {
                id: loggedInUserId,
                user_type: "client",
            },
        });
        if (!clientExists) {
            res.status(404).json({ error: "Client not found or invalid client ID." });
            return;
        }
        // If assigned_people is provided, validate developers
        let developerAssignments = [];
        if (assigned_people && assigned_people.length > 0) {
            const developers = yield database_1.default.user.findMany({
                where: {
                    id: { in: assigned_people },
                    user_type: "developer",
                },
            });
            if (developers.length !== assigned_people.length) {
                res
                    .status(404)
                    .json({ error: "One or more developer IDs are invalid." });
                return;
            }
            developerAssignments = assigned_people.map((devId) => ({
                developer_id: devId,
            }));
        }
        // Create project with only provided fields
        const project = yield database_1.default.project.create({
            data: Object.assign(Object.assign(Object.assign(Object.assign({ name, client_id: loggedInUserId }, (description && { description })), (start_date && { start_date: new Date(start_date) })), (status && { status: status })), (developerAssignments.length > 0 && {
                assigned_people: { create: developerAssignments },
            })),
        });
        res.status(201).json({
            message: "Project created successfully",
            project,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createProject = createProject;
// Fetch all projects for a client
// ================================
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const fetchProjectsForClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: loggedInUserId } = req.body.user;
    try {
        const projects = yield database_1.default.project.findMany({
            where: { client_id: parseInt(loggedInUserId) },
            include: { assigned_people: true },
        });
        res.status(200).json({
            message: "Projects fetched successfully",
            projects: projects,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching client projects" });
    }
});
exports.fetchProjectsForClient = fetchProjectsForClient;
// Fetch all projects assigned to a developer
// ================================
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const fetchProjectsForDeveloper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: loggedInUserId } = req.body.user;
    try {
        const projects = yield database_1.default.project.findMany({
            where: {
                assigned_people: {
                    some: { developer_id: parseInt(loggedInUserId) },
                },
            },
            include: { assigned_people: true },
        });
        res.status(200).json({
            message: "Projects fetched successfully",
            projects: projects,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching client projects" });
    }
});
exports.fetchProjectsForDeveloper = fetchProjectsForDeveloper;
// Fetch single projects assigned to a developer
// ================================
/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const fetchSingleProjectsForClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: loggedInUserId } = req.body.user;
    const { projectId } = req.params;
    try {
        // fetch project for single
        const project = yield database_1.default.project.findUnique({
            where: {
                id: parseInt(projectId),
            },
            include: { assigned_people: true },
        });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        // Authorization: Ensure the client owns the project
        if (project.client_id !== loggedInUserId) {
            res
                .status(403)
                .json({ error: "You are not authorized to view this project" });
            return;
        }
        res.status(200).json({
            message: "Project fetched successfully",
            project: project,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching client projects" });
    }
});
exports.fetchSingleProjectsForClient = fetchSingleProjectsForClient;
// delete project for client --> only client can delete project
// ================================
/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const { id: loggedInUserId } = req.body.user;
        const project = yield database_1.default.project.findUnique({
            where: {
                id: parseInt(projectId),
            },
        });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        if (project.client_id !== parseInt(loggedInUserId)) {
            res
                .status(403)
                .json({ error: "You are not authorized to delete this project" });
        }
        yield database_1.default.project.delete({
            where: { id: parseInt(projectId) },
        });
        res.status(200).json({ message: "Project deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching client projects" });
    }
});
exports.deleteProject = deleteProject;
// edit project for client --> only client can edit project
/**
 * Update a project
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { name, description, status, start_date, assigned_people } = req.body;
    const { id: loggedInUserId } = req.body.user;
    try {
        const project = yield database_1.default.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { assigned_people: true },
        });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        if (project.client_id !== loggedInUserId) {
            res
                .status(403)
                .json({ error: "You are not authorized to update this project" });
            return;
        }
        let developerAssignments = [];
        if (Array.isArray(assigned_people)) {
            if (assigned_people.length > 0) {
                const validDevelopers = yield database_1.default.user.findMany({
                    where: {
                        id: { in: assigned_people },
                        user_type: "developer",
                    },
                });
                if (validDevelopers.length !== assigned_people.length) {
                    res
                        .status(400)
                        .json({ error: "One or more developer IDs are invalid." });
                    return;
                }
                developerAssignments = assigned_people.map((devId) => ({
                    developer_id: devId,
                }));
            }
        }
        else if (assigned_people !== undefined) {
            res.status(400).json({ error: "Invalid assigned_people format" });
            return;
        }
        let formattedStartDate = project.start_date;
        if (start_date) {
            const parsedDate = new Date(start_date);
            if (!isNaN(parsedDate.getTime())) {
                formattedStartDate = parsedDate;
            }
            else {
                res.status(400).json({ error: "Invalid start date format" });
                return;
            }
        }
        const updatedProject = yield database_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const projectUpdate = yield tx.project.update({
                where: { id: parseInt(projectId) },
                data: {
                    name: name || project.name,
                    description: description || project.description,
                    status: status || project.status,
                    start_date: formattedStartDate,
                },
            });
            if (Array.isArray(assigned_people)) {
                yield tx.assignedPeople.deleteMany({
                    where: { project_id: project.id },
                });
                if (assigned_people.length > 0) {
                    yield tx.assignedPeople.createMany({
                        data: developerAssignments.map((dev) => ({
                            project_id: project.id,
                            developer_id: dev.developer_id,
                        })),
                    });
                }
            }
            return projectUpdate;
        }));
        res.status(200).json({
            message: "Project updated successfully",
            project: updatedProject,
        });
    }
    catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateProject = updateProject;
