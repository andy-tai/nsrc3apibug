

import { ServiceName } from "./service_name";

export class ServiceNode {
    static readonly DEFAULT_PORT: number = 3553;
    
    public constructor(
        public name: string,
        public hostName: string,
        public ipAddr: string,
        public port: number /*integer*/ = ServiceNode.DEFAULT_PORT) {
    }
        
    public get displayName(): string {
        if (this.name) {
            return this.name;
        }
        return this.name;
    }
    
    
    public equals(other: ServiceNode) {
        if ((this.name == other.name)) {
           return true;
        }
        return false;
    }
}