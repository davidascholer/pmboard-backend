/**
 This file contains the return signatures for project-related queries.
 It defines the structure of the data required for the respective responses.
 Data not included is intentionally commented out for toggle ability.
 **/


const projectMemberSelect = {
  id: true,
  userId: true,
  role: true,
  // project:
  // projectId: true,
  // tickets:
};

// const userSelect = {
//   id: true,
//   name: true,
//   email: true,
//   // setting: true,
//   // createdAt: true,
//   // updatedAt: true,
//   // projectsOwned:
// };

const ticketSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  section: true,
  status: true,
  severity: true,
  timeEstimateMin: true,
  // project:
  // projectId:
  // Feature:
  // featureId:
  assignees: {
    select: projectMemberSelect,
  },
};

const featureSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  // projectId: true,
  // project:
  tickets: {
    select: ticketSelect,
  },
};

// Extends a User for a project
// model ProjectMember {
//   id        String   @id @default(uuid())
//   userId    String
//   role      Role     @default(MEMBER)
//   project   Project  @relation(fields: [projectId], references: [id])
//   projectId String
//   tickets   Ticket[]
// }

const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  projectType: true,
  // owner: {
  //   select: userSelect,
  // },
  members: {
    select: projectMemberSelect,
  },
  tickets: {
    select: ticketSelect,
  },
  features: {
    select: featureSelect,
  },
};

export default projectSelect;
