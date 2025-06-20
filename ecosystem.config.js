module.exports = {
    apps: [
        {
            name: "trackalot",
            script: "build/index.js",
            node_args: "--max-old-space-size=2048",
            autorestart: true,
            max_restarts: 5,
            restart_delay: 5000,
            watch: false,
            // env: {
            //     NODE_ENV: "production",
            // },
        },
    ],
};
