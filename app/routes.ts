import {type RouteConfig, route, layout} from "@react-router/dev/routes";

export default [
    layout("routes/admin/admin-layout.tsx", [
        route('Dashboard', 'routes/admin/Dashboard.tsx'),
        route('all-users', 'routes/admin/all-users.tsx')
    ]),
] satisfies RouteConfig;