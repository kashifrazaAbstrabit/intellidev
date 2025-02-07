import { ProjectStatus } from "@prisma/client";
import prisma from "../config/database";
import { IProject } from "../types/project";
import { Request, Response } from "express";

/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const createProject = async (
  req: Request<{}, {}, IProject>,
  res: Response
): Promise<void> => {
  const { name, description, status, start_date, assigned_people } = req.body;
  const { id: loggedInUserId } = req.body.user;

  if (!name) {
    res.status(400).json({ message: "Please enter project name" });
    return;
  }

  try {
    // Ensure client exists
    const clientExists = await prisma.user.findUnique({
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
    let developerAssignments: string | any[] = [];
    if (assigned_people && assigned_people.length > 0) {
      const developers = await prisma.user.findMany({
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

      developerAssignments = assigned_people.map((devId: number) => ({
        developer_id: devId,
      }));
    }

    // Create project with only provided fields
    const project = await prisma.project.create({
      data: {
        name,
        client_id: loggedInUserId,
        ...(description && { description }),
        ...(start_date && { start_date: new Date(start_date) }),
        ...(status && { status: status as ProjectStatus }),
        ...(developerAssignments.length > 0 && {
          assigned_people: { create: developerAssignments },
        }),
      },
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch all projects for a client
// ================================
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const fetchProjectsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: loggedInUserId } = req.body.user;

  try {
    const projects = await prisma.project.findMany({
      where: { client_id: parseInt(loggedInUserId) },
      include: { assigned_people: true },
    });

    res.status(200).json({
      message: "Projects fetched successfully",
      projects: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching client projects" });
  }
};

// Fetch all projects assigned to a developer
// ================================
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const fetchProjectsForDeveloper = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: loggedInUserId } = req.body.user;

  try {
    const projects = await prisma.project.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching client projects" });
  }
};

// Fetch single projects assigned to a developer
// ================================
/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const fetchSingleProjectsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: loggedInUserId } = req.body.user;
  const { projectId } = req.params;

  try {
    // fetch project for single
    const project = await prisma.project.findUnique({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching client projects" });
  }
};

// delete project for client --> only client can delete project
// ================================
/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { id: loggedInUserId } = req.body.user;
    const project = await prisma.project.findUnique({
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
    await prisma.project.delete({
      where: { id: parseInt(projectId) },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error fetching client projects" });
  }
};

// edit project for client --> only client can edit project
/**
 * Update a project
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const { name, description, status, start_date, assigned_people } = req.body;
  const { id: loggedInUserId } = req.body.user;

  try {
    const project = await prisma.project.findUnique({
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

    let developerAssignments: { developer_id: number }[] = [];
    if (Array.isArray(assigned_people)) {
      if (assigned_people.length > 0) {
        const validDevelopers = await prisma.user.findMany({
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

        developerAssignments = assigned_people.map((devId: number) => ({
          developer_id: devId,
        }));
      }
    } else if (assigned_people !== undefined) {
      res.status(400).json({ error: "Invalid assigned_people format" });
      return;
    }

    let formattedStartDate: Date | null = project.start_date;
    if (start_date) {
      const parsedDate = new Date(start_date);
      if (!isNaN(parsedDate.getTime())) {
        formattedStartDate = parsedDate;
      } else {
        res.status(400).json({ error: "Invalid start date format" });
        return;
      }
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
      const projectUpdate = await tx.project.update({
        where: { id: parseInt(projectId) },
        data: {
          name: name || project.name,
          description: description || project.description,
          status: (status as ProjectStatus) || project.status,
          start_date: formattedStartDate,
        },
      });

      if (Array.isArray(assigned_people)) {
        await tx.assignedPeople.deleteMany({
          where: { project_id: project.id },
        });

        if (assigned_people.length > 0) {
          await tx.assignedPeople.createMany({
            data: developerAssignments.map((dev) => ({
              project_id: project.id,
              developer_id: dev.developer_id,
            })),
          });
        }
      }

      return projectUpdate;
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
