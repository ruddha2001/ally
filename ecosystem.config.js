module.exports = {
    apps: [
        {
            name: 'ally',
            script: 'npm start',
            instances: 1,
            autorestart: true,
            max_restarts: 5,
            restart_delay: 24000, // 24 seconds delay between restarts (5 * 24s ≈ 2 minutes total span)
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
