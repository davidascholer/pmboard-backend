import { Project } from "@prisma/client";

export type ProjectResponseType = {
    id: Project["id"];
    name: Project["name"];
    description: Project["description"];
    createdAt: Project["createdAt"];
    updatedAt: Project["updatedAt"];
    projectType: Project["projectType"];
}