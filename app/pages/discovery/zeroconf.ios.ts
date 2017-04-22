/*
 *  Copyright 2017 Le Technology, Inc.
 *  written by Li-Cheng (Andy) Tai, andy.tai@le.com
 *
 */

import { NgZone } from "@angular/core";

import {ServiceName} from "../../data/service_name";
import {ServiceNode} from "../../data/service_node";
import {ZeroconfInterface} from "./zeroconf_interface";
import {DiscoveryPage} from "./discovery_page";
 
const WAIT_TIME = 500; // ms

// begin iOS specific
const enum Action {
    ADD,
    DELETE
}

const RESOLVE_TIMEOUT: number = 5.0;  /* sec */

class IOSResolveDelegate 
    extends NSObject
    implements NSNetServiceDelegate {
    static ObjCProtocols = [NSNetServiceDelegate] // define our native protocalls
    
    static new(): IOSResolveDelegate {
        return <IOSResolveDelegate>super.new() // calls new() on the NSObject
    }
        
    public action: Action = Action.ADD;
    
	netServiceDidNotResolve(sender: NSNetService, errorDict: NSDictionary<string, number>): void {
        console.log("IOSResolveDelegate: netServiceDidNotResolve for " + sender );
	}
	
	netServiceDidResolveAddress(sender: NSNetService): void {
        console.log("IOSResolveDelegate: service resolved: " + sender );

        //console.dump(sender);
        {
            let page: DiscoveryPage = DiscoveryPage.getInstance();

            let bytes = 
                new interop.Reference(interop.types.uint8, sender.addresses[0].bytes);
            console.log("bytes: " + bytes);
            let pAddrIn: interop.Reference<sockaddr_in>
                = new interop.Reference(sockaddr_in, bytes);

            let ipString: string = 
                NSString.stringWithCStringEncoding(
                    inet_ntoa(pAddrIn.value.sin_addr), 1).toString();
                    //https://groups.google.com/d/msg/nativescript/Z9kh9YYVobA/gKA__quAAP0J
            console.log("Address resolved: " + ipString);
            
            let node: ServiceNode = new ServiceNode(sender.name, sender.hostName, ipString, sender.port);
            
            switch(this.action) {
            case Action.ADD:
                console.log("action is to add");
                page.add(node);
                break;
            case Action.DELETE:
                console.log("action is to delete");
                page.delete(node);
                break;
            }
                
        }
	
	}
	
}
    
class IOSDiscoveryDelegate 
    extends NSObject 
    implements NSNetServiceBrowserDelegate {    
    static ObjCProtocols = [NSNetServiceBrowserDelegate] // define our native protocalls
    
    static new(): IOSDiscoveryDelegate {
        return <IOSDiscoveryDelegate>super.new() // calls new() on the NSObject
    }
        
	netServiceBrowserWillSearch(browser: NSNetServiceBrowser): void {
	    console.log("IOSDiscoveryDelegate: begin search");
	}
	
	netServiceBrowserDidStopSearch(browser: NSNetServiceBrowser): void {
	    console.log("IOSDiscoveryDelegate: stop search");
	}
	
	netServiceBrowserDidFindServiceMoreComing(
        browser: NSNetServiceBrowser, service: NSNetService, moreComing: boolean): void {
        console.log("IOSDiscoveryDelegate: service joined: " + service + " more info coming " + moreComing);
        //console.dump(service);
        if (service.name.startsWith(ServiceName.APOLLO_SERVICE_PREFIX)) {
            let delegate = IOSResolveDelegate.new();
            delegate.action = Action.ADD;
            service.delegate = delegate;
            Zeroconf.services.unshift(service); // keep strong reference
            setTimeout( () => {
                service.resolveWithTimeout(RESOLVE_TIMEOUT)
            }, WAIT_TIME);
        }
    }
    
	netServiceBrowserDidRemoveServiceMoreComing(browser: NSNetServiceBrowser, service: NSNetService, moreComing: boolean): void {
        console.log("IOSDiscoveryDelegate: service left: " + service + " more info coming " + moreComing);
        //console.dump(service);
        if (service.name.startsWith(ServiceName.APOLLO_SERVICE_PREFIX)) {
            let delegate = IOSResolveDelegate.new();
            delegate.action = Action.DELETE;
            service.delegate = delegate;
            Zeroconf.services.unshift(service); // keep strong reference
            setTimeout( () => {
                service.resolveWithTimeout(RESOLVE_TIMEOUT)
            }, WAIT_TIME);
        }
	}
	
	netServiceBrowserDidNotSearch(browser: NSNetServiceBrowser, errorDict: NSDictionary<string, number>): void {
        console.log("IOSDiscoveryDelegate: no service found?");
    
    }
    
}
// end iOS specific

export class Zeroconf implements ZeroconfInterface {
    protected static readonly LOCAL: string = "local.";
    
    protected delegate; /* iOS */    
    protected browser = null; /* iOS */

    public static services: Array<NSNetService> = [];
    public constructor(
        protected zone: NgZone) {
    }
        
    public start() {
        {
            console.log("invoke iOS's NSNetService browser");
            if (this.browser == null) {
                this.browser = NSNetServiceBrowser.alloc().init();
            }
            this.browser.includesPeerToPeer = true;
            this.delegate = IOSDiscoveryDelegate.new(); // keeps a strong reference to the delegate object
            this.browser.delegate = this.delegate;
            this.browser.searchForServicesOfTypeInDomain(
                ServiceName.APOLLO_SERVICE_TYPE,
                Zeroconf.LOCAL
            );
        }
    }
    
    public stop() {
        {
           this.browser.stop();            
        }
    }
}
