import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { DiscoveryPage } from "./pages/discovery/discovery_page";

export const routes: Routes = [
    { path: "", redirectTo: "/discovery", pathMatch: "full" },
    { path: "discovery", component: DiscoveryPage },
];

export const navigatableComponents = [
    DiscoveryPage,
];
