import path from 'node:path';

export function isExternalPath(repository:string,target:string,paths:path.PlatformPath=path):boolean {
 if(!paths.isAbsolute(target))return false;
 const relative=paths.relative(repository,target);
 return paths.isAbsolute(relative)||relative==='..'||relative.startsWith(`..${paths.sep}`);
}
