

import { NgZone } from "@angular/core";

import {ServiceName} from "../../data/service_name";
import {ServiceNode} from "../../data/service_node";
import {ZeroconfInterface} from "./zeroconf_interface";
import {DiscoveryPage} from "./discovery_page";

const WAIT_TIME = 500; // ms
var mainThreadZone;

// begin Android specific

var nsd: android.net.nsd.NsdManager = null;

var resolveListeners: Map<android.net.nsd.NsdServiceInfo, AndroidResolveListener> =
    new Map<android.net.nsd.NsdServiceInfo, AndroidResolveListener>();

@Interfaces([android.net.nsd.NsdManager.ResolveListener])
class AndroidResolveListener extends java.lang.Object
    implements android.net.nsd.NsdManager.IResolveListener {
        
    constructor() {
    // as seen in https://github.com/NativeScript/docs/issues/376
        console.log("in AndroidResolveListener constructor");
       
        super();
        return global.__native(this);
        
    }
    onResolveFailed(serviceInfo: android.net.nsd.NsdServiceInfo, errorCode: number): void {
        console.log("in AndroidResolveListener onResolveFailed " + serviceInfo + " error code " + errorCode);
        if (errorCode == android.net.nsd.NsdManager.FAILURE_ALREADY_ACTIVE) {
            setTimeout( ()=> {
                    nsd.resolveService(serviceInfo, resolveListeners.get(serviceInfo));   
                }, WAIT_TIME);
        }
    }
    onServiceResolved(serviceInfo: android.net.nsd.NsdServiceInfo): void {
        console.log("in AndroidResolveListener onServiceResolved " + serviceInfo);
        let node = new ServiceNode(serviceInfo.getServiceName(), 
                null,
                serviceInfo.getHost().getHostAddress(), 
                serviceInfo.getPort());
        let page: DiscoveryPage = DiscoveryPage.getInstance();
        page.add(node);
        resolveListeners.delete(serviceInfo);
    }    
}


@Interfaces([android.net.nsd.NsdManager.DiscoveryListener])
class AndroidDiscoveryListener extends java.lang.Object
    implements android.net.nsd.NsdManager.IDiscoveryListener {
    
    constructor() {
    // as seen in https://github.com/NativeScript/docs/issues/376
        console.log("in AndroidDiscoveryListener constructor");
        super();
        return global.__native(this);
    }
    
    onStartDiscoveryFailed(serviceType: string, errorCode: number): void {
        console.log("in AndroidDiscoveryListener onStartDiscoveryFailed " + " error code " + errorCode); 
    }
    
    onStopDiscoveryFailed(serviceType: string, errorCode: number): void {
        console.log("in AndroidDiscoveryListener onStopDiscoveryFailed " + " error code " + errorCode);
    }
    
    onDiscoveryStarted(serviceType: string): void {
        console.log("in AndroidDiscoveryListener onDiscoveryStarted");
    }
    
    onDiscoveryStopped(serviceType: string): void {
        console.log("in AndroidDiscoveryListener onDiscoveryStopped");
    }
    
    onServiceFound(serviceInfo: android.net.nsd.NsdServiceInfo): void {
        console.log("in AndroidDiscoveryListener onServiceFound " + serviceInfo);
        {
            
            let resolveListener = new AndroidResolveListener();
            nsd.resolveService(serviceInfo, resolveListener);
            resolveListeners.set(serviceInfo, resolveListener);
        }
    }
    
    onServiceLost(serviceInfo: android.net.nsd.NsdServiceInfo): void {
        console.log("in AndroidDiscoveryListener onServiceLost " + serviceInfo);
        {
            
            let page: DiscoveryPage = DiscoveryPage.getInstance();
            let addr = null;
            if (serviceInfo.getHost())
                addr = serviceInfo.getHost().getHostAddress();
            page.delete(new ServiceNode(serviceInfo.getServiceName(),  
                null,
                addr,
                serviceInfo.getPort()));
        }
    }
}
// end Android specific

export class Zeroconf implements ZeroconfInterface {
    protected static readonly LOCAL: string = "local.";
    
    protected context;
    protected listener = null;

    public constructor(
        protected zone: NgZone) {    
        mainThreadZone = zone;
    }
        
    public start() {
            
            console.log("invoke Android's NsdManager");
            var app = require("application");
            this.context = app.android.currentContext;
            nsd = this.context.getSystemService(android.content.Context.NSD_SERVICE );
            console.log("nsd: " + nsd);
            this.listener = new AndroidDiscoveryListener();

            console.log("listener: " + this.listener);
            nsd.discoverServices(
                ServiceName.SERVICE_TYPE, 
                android.net.nsd.NsdManager.PROTOCOL_DNS_SD, 
                (this.listener));
            
    }
    
    public stop() {
            nsd.stopServiceDiscovery(this.listener);            
    }
}

