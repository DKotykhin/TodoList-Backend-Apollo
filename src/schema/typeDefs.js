
export const typeDefs = `#graphql
    scalar Date
    type User {
        _id: ID!
        name: String!
        email: String!
        avatarURL: String        
        createdAt: Date        
        message: String              
    }
    type UserWithToken {
        _id: ID!
        name: String!
        email: String!
        avatarURL: String        
        createdAt: Date        
        token: String
        message: String              
    }
    type UserPasswordResponse {
        status: Boolean
        message: String
    }
    type UserDeleteResponse {
        taskStatus: UserDeleteStatus
        userStatus: UserDeleteStatus
        message: String
    }
    type UserDeleteStatus { 
        acknowledged: Boolean
        deletedCount: Int
    }
    type UserAvatarResponse {
        avatarURL: String
        message: String
    }
    type Task {
        _id: ID!
        title: String!
        subtitle: String
        description: String
        completed: Boolean
        deadline: Date
        createdAt: Date
        updatedAt: Date
        message: String
    }    
    type TaskDeleteResponse {
        status: TaskDeleteStatus        
        message: String 
    }
    type TaskDeleteStatus {
        acknowledged: Boolean
        deletedCount: Int
    }
    type getTasksResponse {
        totalTasksQty: Int
        totalPagesQty: Int
        tasksOnPageQty: Int
        tasks: [Task]
    }
    type TaskStatisticResponse {
        totalTasks: Int
        completedTasks: Int
        activeTasks: Int
        overdueTasks: Int
        message: String
    }

    input UserRegisterInput {        
        name: String!
        email: String!
        password: String!          
    }       
    input TaskParamsInput {
        limit: Int
        page: Int
        tabKey: Int
        sortField: String
        sortOrder: Int
        search: String
    }
    input TaskAddInput {     
        title: String!
        subtitle: String
        description: String
        completed: Boolean
        deadline: Date        
    }
    input TaskUpdateInput {
        _id: ID!      
        title: String!
        subtitle: String
        description: String
        completed: Boolean
        deadline: Date        
    }
    
    type Query {        
        getUserByToken: User        
        getTasks(paramsInput: TaskParamsInput): getTasksResponse
        userLogin(email: String!, password: String!): UserWithToken
        getStatistic: TaskStatisticResponse
    }
    
    type Mutation {
        userRegister(registerInput: UserRegisterInput): UserWithToken
        userDelete(_id: ID!): UserDeleteResponse
        userUpdateName(name: String!): User
        userConfirmPassword(password: String!): UserPasswordResponse
        userUpdatePassword(password: String!): UserPasswordResponse
        uploadAvatar(avatarURL: String!): UserAvatarResponse
        deleteAvatar(_id: ID!): UserAvatarResponse
        createTask(createTaskInput: TaskAddInput): Task
        updateTask(updateTaskInput: TaskUpdateInput): Task
        deleteTask(_id: ID!): TaskDeleteResponse
    }
`;
