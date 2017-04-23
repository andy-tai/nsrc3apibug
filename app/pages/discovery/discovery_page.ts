

import { Component, ElementRef, NgZone, OnInit, OnDestroy, ViewChild } from "@angular/core";
import {Location} from "@angular/common";
import { RouterExtensions } from "nativescript-angular/router";

import {exit} from 'nativescript-exit';

import {Page} from "ui/page";

import {ServiceNode} from "../../data/service_node";

var zeroConfModule = require("./zeroconf");

@Component({
    selector: "discovery",
    moduleId: module.id,
    templateUrl: "./discovery_page.html",
    styleUrls: ["./discovery_page-common.css", "./discovery_page.css"],

})
export class DiscoveryPage implements OnInit, OnDestroy {
    serviceList: Array<ServiceNode> = [];
    
    
    protected zeroconf;
    
    /* we only should have one instane of this */
    protected static instance: DiscoveryPage = null;  
    
    public static getInstance(): DiscoveryPage {
        return DiscoveryPage.instance;
    }

    constructor(        
        protected page: Page, 
        protected router: RouterExtensions,
        location: Location,
        protected zone: NgZone) {
        this.zeroconf = new zeroConfModule.Zeroconf(zone);
        DiscoveryPage.instance = this;
        page.actionBarHidden = false;
    }
    
    onEnter() {
        this.zeroconf.start();    
    }
    
    onExit() {
        this.zeroconf.stop();    
    }
    
    ngOnInit() {
        console.log("page: " + this.page + " zone: " + this.zone);
        
        this.page.on("navigatedTo", event => {
            this.onEnter();
        });
        
        this.page.on("navigatedFrom", event => {
            this.onExit();
        });
        
    }

    ngOnDestroy() {
    }
    
    onRefresh() {
        console.log("on refresh");
        this.zeroconf.stop();
        this.zeroconf.start();
    }
    
    onBack() {
        console.log("on back button");
        exit();
    }
    
    public add(service: ServiceNode) {
        console.log("DiscoveryPage: trying to add " + service.name + " " + service.ipAddr + " " + service.port);
        this.zone.run( () => {
            let found: boolean = false;
            for (var node of this.serviceList) {
                if (node.equals(service)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.serviceList.unshift(service);
                console.log("added service " + service);
            }
        });
    }
    
    public delete(service: ServiceNode) {
        console.log("DiscoveryPage: trying to remove "+ service.name +  " " + service.ipAddr + " " + service.port);
        this.zone.run( () => {
            let i = 0;
            for (var node of this.serviceList) {
                if (node.equals(service)) {
                    this.serviceList.splice(i, 1);
                    console.log("removed service " + service);
                    return;
                }
                i++;
            }
        });
    
    }
    
    
}
