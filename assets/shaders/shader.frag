uniform vec2 iResolution;
uniform float iTime;

#define MIN_DIST 0.0
#define MAX_DIST 80.0
#define EPSILON 0.0001

// Raymarching - booleans
float intersectSDF(float da, float db) {
    return max(da, db);
}
float unionSDF(float da, float db) {
    return min(da, db);
}
float differenceSDF(float da, float db) {
    return max(da, -db);
}

// Raymarching - rotation
mat3 rotateX(float t) {
    return mat3(vec3(1, 0, 0), vec3(0, cos(t), -sin(t)),vec3(0, sin(t), cos(t)));
}
mat3 rotateY(float t) {
    return mat3(vec3(cos(t), 0, sin(t)),vec3(0, 1, 0),vec3(-sin(t), 0, cos(t)));
}
mat3 rotateZ(float t) {
    return mat3(vec3(cos(t), -sin(t), 0),vec3(sin(t), cos(t), 0),vec3(0, 0, 1));
}

//Raymarching - create objects
float boxSDF(vec3 p, vec3 size) {
    vec3 da = abs(p) - (size / 2.0);
    return min(max(da.x, max(da.y, da.z)), 0.0) + length(max(da, 0.0));
}
float sphereSDF(vec3 p, float r) {
    return (length(p) - r);
}
float cylinderSDF(vec3 p, float h, float r) {
    return min(max(length(p.xy) - r, abs(p.z) - h/2.0), 0.0) + length(max(vec2(length(p.xy) - r, abs(p.z) - h/2.0), 0.0));
}
float torusSDF( vec3 p, vec2 t ) {
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

// Raymarching - operators
float pMod1(inout float p, float size) {
    float halfsize = size*0.5;
    float c = floor((p+halfsize)/size);
    p = mod(p+halfsize,size)-halfsize;
    return c;
}
// Shortcut for 45-degrees rotation
void pR45(inout vec2 p) {
    p = (p + vec2(p.y, -p.x))*sqrt(0.5);
}
// The "Round" variant uses a quarter-circle to join the two objects smoothly:
float fOpUnionRound(float a, float b, float r) {
    vec2 u = max(vec2(r - a,r - b), vec2(0));
    return max(r, min (a, b)) - length(u);
}

float fOpDifferenceColumns(float a, float b, float r, float n) {
    a = -a;
    float m = min(a, b);
    //avoid the expensive computation where not needed (produces discontinuity though)
	if ((a < r) && (b < r)) {
        vec2 p = vec2(a, b);
        float columnradius = r*sqrt(2.0)/n/2.0;
        columnradius = r*sqrt(2.0)/((n-1.0)*2.0+sqrt(2.0));
        pR45(p);
        p.y += columnradius;
        p.x -= sqrt(2.0)/2.0*r;
        p.x += -columnradius*sqrt(2.0)/2.0;
        if (mod(n,2.0) == 1.0) {
            p.y += columnradius;
        }
		pMod1(p.y,columnradius*2.0);
        float result = -length(p) + columnradius;
        result = max(result, p.x);
        result = min(result, a);
        return -min(result, b);
    }
	else 
	{
        return -m;
    }
}

float fOpUnionColumns(float a, float b, float r, float n) {
    if ((a < r) && (b < r)) {
        vec2 p = vec2(a, b);
        float columnradius = r*sqrt(2.0)/((n-1.0)*2.0+sqrt(2.0));
        pR45(p);
        p.x -= sqrt(2.0)/2.0*r;
        p.x += columnradius*sqrt(2.0);
        if (mod(n,2.0) == 1.0) {
            p.y += columnradius;
        }
		pMod1(p.y, columnradius*2.0);
        float result = length(p) - columnradius;
        result = min(result, p.x);
        result = min(result, a);
        return min(result, b);
    } 
	else {
        return min(a, b);
    }
}

vec3 opTwist( vec3 p ) {
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}


// Raymarching - scenes
float scene1(vec3 samplePoint) {
    samplePoint = rotateY(iTime / 2.0) * rotateX(iTime / 2.0) * samplePoint;
    //nut
	float cylinderRadius = 0.4 + (1.0 - 0.4) * (1.0 + sin(1.7 * iTime)) / 4.0;
    float cylinder1 = cylinderSDF(samplePoint, 2.0, cylinderRadius);
    float cylinder2 = cylinderSDF(rotateX(radians(90.0)) * samplePoint, 2.0, cylinderRadius);
    float cylinder3 = cylinderSDF(rotateY(radians(90.0)) * samplePoint, 2.0, cylinderRadius);
    float cube = boxSDF(samplePoint, vec3(1.8, 1.8, 1.8));
    float sphere = sphereSDF(samplePoint, 1.2);
    float csgNut = differenceSDF(intersectSDF(cube, sphere), unionSDF(cylinder1, unionSDF(cylinder2, cylinder3)));
    if(sin(iTime * 0.25) >= 0.0){
        //middle
        vec3 twistPoint = samplePoint;
        csgNut = unionSDF(csgNut, cylinderSDF(twistPoint, 1.5, cylinderRadius/2.));
        csgNut = unionSDF(csgNut, cylinderSDF(rotateX(radians(90.0)) * twistPoint, 1.5, cylinderRadius/2.));
        csgNut = unionSDF(csgNut, cylinderSDF(rotateY(radians(90.0)) * twistPoint, 1.5, cylinderRadius/2.));
        //toruses around
        vec3 torusPoint = rotateX(-iTime * 2.0) * rotateY(-iTime * 2.0) * samplePoint;
        vec3 torusPoint2 = rotateY(iTime * 2.0) * rotateZ(iTime * 2.0) * samplePoint;
        vec3 torusPoint3 = rotateX(iTime * 2.0) * rotateZ(iTime * 2.0) * samplePoint;
        csgNut = unionSDF(csgNut, torusSDF(torusPoint, vec2(2.5,0.05)));
        csgNut = unionSDF(csgNut, torusSDF(rotateX(radians(90.0)) * torusPoint2, vec2(2.5,0.05)));
        csgNut = unionSDF(csgNut, torusSDF(rotateZ(radians(90.0)) * torusPoint3, vec2(2.5,0.05)));
    }
	else 
    {
        csgNut = unionSDF(csgNut, sphereSDF(samplePoint, 0.2));
    }

	return csgNut;
}


float scene2(vec3 p) {
    
	//rotate the whole space
    p = rotateY(radians(90.0)) * p;
    
	//mirror the whole space
    p.x = -abs(p.x) + 0.6;
    
	//repeat
    float c = pMod1(p.z, 2.);
    float wall = boxSDF(p, vec3(0.2,2.,2.));
    if(sin(iTime * 0.25) >= 0.0){
        float wall_pillar = boxSDF(rotateY(radians(-90.0)) * p + vec3(0.9,0.,0.), vec3(0.2,2.,0.3));
        wall = fOpUnionRound(wall_pillar, wall, 0.05);
    }
    else {
        float wall_pillar = boxSDF(rotateY(radians(-90.0)) * p + vec3(0.9,0.,0.), vec3(0.2,2.,0.4));
        wall = fOpUnionColumns(wall_pillar, wall, 0.05, 2.0);
    }    
    
	//window shape
    p.z = abs(p.z)-.3;
    p.z = abs(p.z)+.02;
    
	//window
    float box = boxSDF(p, vec3(0.3,0.9,0.4));
    p.y -= .45;
    float cylinder = cylinderSDF(rotateY(radians(90.)) * p, 0.3, 0.2);
    float window = min(box, cylinder);
    p.y += 1.5;
    float ground = boxSDF(p, vec3(2.0,0.2,2.0));
    p.y -=2.2;
    p.x -= 0.5;
    p = rotateZ(radians(35.0)) * p;
    float roof = boxSDF(p, vec3(1.0,0.2,2.0));
    roof = min(roof, ground);
    float wallWindow = fOpDifferenceColumns(wall, window, 0.04, 2.);
    return fOpUnionColumns(roof, wallWindow, 0.06, 2.);
}

// Raymarching - main scene
float sceneSDF(vec3 p)
{
    if(sin(iTime * 0.5) < 0.0)
    {
        return scene1(p);
    }
	return scene2(p);
}

// Raymarching - rendering code
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < 255; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
            return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}           

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 1.5);
    return normalize(vec3(xy, -z));
}

vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    }
    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    vec3 light1Pos = vec3(4.0 * sin(iTime),
                          2.0,
                          4.0 * cos(iTime));
    vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);
    vec3 light2Pos = vec3(2.0 * sin(0.37 * iTime),
                          2.0 * cos(0.37 * iTime),
                          2.0);
    vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);
    return color;
}

mat4 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}

/*
END OF RAYMARCH CODE ///////////////////////////////////////////////////////////////////////////////////
*/


/*
ELEVATOR
*/

float soc(vec3 p) {
    vec3 n = normalize(sign(p+1e6));
    return min(
			min(dot(p.xy,n.xy), 
				dot(p.yz,n.yz)),
				dot(p.xz,n.xz));
}

mat2 r2d(float a) {
    float sa = sin(a);
    float ca = cos(a);
    return mat2(ca,sa,-sa,ca);
}

vec2 amod(vec2 p, float m) {
    float a = mod(atan(p.x,p.y), m) - m*.5;
    return vec2(cos(a),sin(a))*length(p);
}

float map(vec3 p) {
    mat2 r = r2d(iTime);
    float d = 1.;
    p.xz = amod(p.xz,.785);
    p.x-= 5.;
    p.x = mod(p.x,4.)-2.;
    p.y = mod(p.y,5.)-2.5;
    d = min(d, soc(max(abs(p)-.2,0.))-.1);
    return d;
}

vec3 elevator(vec2 f, vec2 res) {
    vec2 p = vec2(f.x / res.x, f.y / res.y)*2.-1.;
    p.x*=res.x/res.y;
    vec3 ro = vec3(0., iTime * 4., 2.);
    vec3 rd = normalize(vec3(p,-1.));
    vec3 mp = ro;
    float md;
    for(int i=0; i < 50; i++)
	{
        md = map(mp);
        if(md<.001) break;
        mp+=rd*md;
    }
	float rrr = length(ro-mp)*.1;
    return vec3(rrr, rrr, rrr);
}

/*
END OF ELEVATOR
*/

/*
WATER EFFECT
*/

float random (in vec2 _st) 
{
    return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float noise (in vec2 _st) 
{
    vec2 i = floor(_st);
    vec2 f = fract(_st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm ( in vec2 _st) 
{
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
	return v;
}

vec3 generateWater(float time, vec2 st)
{
    vec2 q = vec2(fbm( st + time), fbm( st + vec2(1.0)));
    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);
    float f = fbm(st+r);
    vec3 col = mix(vec3(0.101961,0.619608,0.666667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));
    col = mix(col,
                vec3(0,0,0.164706),
                clamp(length(q),0.0,1.0));
    col = mix(col,
                vec3(0.666667,1,1),
                clamp(length(r.x),0.0,1.0));
    col = vec3((f*f*f+.6*f*f+.5*f)*col);
    return col;
}

/*
END OF WATER EFFECT
*/

void main()
{
    
    vec2 q = gl_FragCoord.xy / iResolution.xy;
    vec3 background = vec3(0);
    
	//fullscreen effects
	vec3 water = generateWater(iTime, q);
    vec3 elev = elevator(gl_FragCoord.xy, iResolution.xy);
    vec3 gradient = vec3(q*0.2, 0.5+0.5*sin(iTime * 2.0));
    
	//camera position
	vec3 eye = vec3(8.0, 0.0, 0.0);
    
	//swap fullscreen effects based on time
    if(sin(iTime * 0.5) >= 0.0){
        eye.x = 8.0 - iTime * 2.0;
        if(sin(iTime * 0.25) >= 0.0){
            gradient = -gradient;
        }
        else{
            gradient = vec3(0.1,0.1,1.0);
        }
    } 
    else
    {
        if(sin(iTime * 0.25) <= 0.0){
            water = mix(water, elev, -elev.r);
            background = water * water;
        }
    }

	//execute raymarching    
	vec3 viewDir = rayDirection(45.0, iResolution.xy, gl_FragCoord.xy);
    mat4 viewToWorld = viewMatrix(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    vec3 worldDir = (viewToWorld * vec4(viewDir, 0.0)).xyz;
    float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);
    if (dist > MAX_DIST - EPSILON) {
        gl_FragColor = vec4(background, 1.0);
        return;
    }

	//texturing
	//ambient, diffuse, specular, shinyness
	vec3 K_a = vec3(0.2, 0.2, 0.2);
	vec3 K_d = vec3(0.7, 0.2, 0.2);
	vec3 K_s = vec3(1.0, 1.0, 1.0);	
    float shinyness = 4.0;
	vec3 color = phongIllumination(K_a, K_d, K_s, shinyness, eye + dist * worldDir, eye);
    
	gl_FragColor = vec4(mix(color, gradient, 0.2), 1.0);
}