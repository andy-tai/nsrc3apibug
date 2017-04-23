demonstration program for the Nativescript bug 
https://github.com/NativeScript/NativeScript/issues/3996

the master branch is working programs on Nativescript 2.5; the ns_3 branch is ported to NS 3.0 from master following the
Nativescript 3.0 announcement instructions.

This program is a browser of Network printer available on the network, discovered via
the native zeroconf networking APIs on both Android (NSD) and iOS (Bonjour). The typescript code accessing the native APIs
are

app/pages/discovery/zeroconf.android.ts    
app/pages/discovery/zeroconf.ios.ts

