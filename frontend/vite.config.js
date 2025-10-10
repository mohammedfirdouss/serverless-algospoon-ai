"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    server: {
        port: 3000,
        open: true,
        host: '0.0.0.0',
        allowedHosts: [
            '3000-mohammedfir-serverlessa-kezvw5s90ib.ws-eu121.gitpod.io',
            '.gitpod.io',
            'localhost',
        ],
        hmr: {
            clientPort: 3000,
            host: '3000-mohammedfir-serverlessa-kezvw5s90ib.ws-eu121.gitpod.io',
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZS5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2aXRlLmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtCQUFvQztBQUNwQyx3RUFBeUM7QUFFekMsa0JBQWUsSUFBQSxtQkFBWSxFQUFDO0lBQzFCLE9BQU8sRUFBRSxDQUFDLElBQUEsc0JBQUssR0FBRSxDQUFDO0lBQ2xCLE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsU0FBUztRQUNmLFlBQVksRUFBRTtZQUNaLDZEQUE2RDtZQUM3RCxZQUFZO1lBQ1osV0FBVztTQUNaO1FBQ0QsR0FBRyxFQUFFO1lBQ0gsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLDZEQUE2RDtTQUNwRTtLQUNGO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsTUFBTSxFQUFFLE1BQU07UUFDZCxTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIG9wZW46IHRydWUsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIGFsbG93ZWRIb3N0czogW1xuICAgICAgJzMwMDAtbW9oYW1tZWRmaXItc2VydmVybGVzc2Eta2V6dnc1czkwaWIud3MtZXUxMjEuZ2l0cG9kLmlvJyxcbiAgICAgICcuZ2l0cG9kLmlvJyxcbiAgICAgICdsb2NhbGhvc3QnLFxuICAgIF0sXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiAzMDAwLFxuICAgICAgaG9zdDogJzMwMDAtbW9oYW1tZWRmaXItc2VydmVybGVzc2Eta2V6dnc1czkwaWIud3MtZXUxMjEuZ2l0cG9kLmlvJyxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgfSxcbn0pO1xuIl19