/**
 This file contains the return signatures for user-related queries.
 It defines the structure of the data required for the respective responses.
 **/

const projectMemberSelect = {
  id: true,
  userId: true,
  role: true,
  memberStatus: true,
};

const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  projectType: true,
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  password: true, // Note: Password must be omitted on response
  settings: true,
  createdAt: true,
  updatedAt: true,
  projectsOwned: {
    select: projectSelect,
  },
  projectsJoined: {
    select: projectMemberSelect,
  },
};

export default userSelect;
