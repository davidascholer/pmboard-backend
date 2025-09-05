/**
 This file contains the return signatures for user-related queries.
 It defines the structure of the data required for the respective responses.
 **/

const projectMemberSelect = {
  id: true,
  userId: true,
  role: true,
  memberStatus: true,
  project: {
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      projectType: true,
      ownerId: true,
    },
  },
};

const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  projectType: true,
  ownerId: true,
  status: true,
  members: {
    select: {
      id: true,
      userId: true,
      role: true,
      memberStatus: true,
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  },
  features: {
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
    },
  },
};

const membershipSelect = {
  status: true,
  startedAt: true,
  endsAt: true,
};

const nextMembershipSelect = {
  status: true,
  startsAt: true,
  endsAt: true,
};

export const projectReturnSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  projectType: true,
  ownerId: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  members: true,
  features: {
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
    },
  },
};

export const userReturnSelect = {
  id: true,
  name: true,
  email: true,
  password: true, // Note: Password must be omitted on response
  settings: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  membership: {
    select: membershipSelect,
  },
  nextMembership: {
    select: nextMembershipSelect,
  },
  projectsOwned: {
    select: projectSelect,
  },
  projectsJoined: {
    select: projectMemberSelect,
  },
};
