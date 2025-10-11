module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testPathIgnorePatterns: ["/node_modules/", "/frontend/"],
  moduleDirectories: ["node_modules", "<rootDir>/backend/functions/meal-plan-worker/node_modules"]
};
