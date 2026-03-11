export class PhysicsEngine {
    constructor(gameState, aircraftConfig) {
        this.gameState = gameState;
        this.config = aircraftConfig;

        // Constants
        this.gravity = 9.81;
        this.airDensity = 1.225; // Sea level standard atmosphere

        // Internal state
        // Three.js uses right-handed coordinate system (Y is up, -Z is forward)
        // We'll calculate local forces, then translate to global
        this.localVelocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3(); // Pitch, Yaw, Roll rates
    }

    update(dt) {
        if (this.gameState.flags.isPaused || this.gameState.flags.isCrashed) return;

        const state = this.gameState.aircraft;
        const controls = this.gameState.controls;
        state.throttle = controls.throttle;

        // 1. Gather current state data
        const pos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
        const velGlobal = new THREE.Vector3(state.velocity.x, state.velocity.y, state.velocity.z);

        // GameState rotation (YXZ Euler order usually handles aircraft well enough for simple models)
        // In three.js standard: X is pitch, Y is yaw, Z is roll.
        // GameState stores heading as positive clockwise, but Three.js standard is anti-clockwise. We map heading internally.
        const euler = new THREE.Euler(state.rotation.pitch, -state.heading, state.rotation.roll, 'YXZ');
        const quat = new THREE.Quaternion().setFromEuler(euler);

        // Convert global velocity to local (body) velocity
        const velLocal = velGlobal.clone().applyQuaternion(quat.clone().invert());

        // Calculate airspeed 
        state.airspeed = velLocal.length();
        const forwardSpeed = -velLocal.z; // -Z is forward

        // 2. Engine Thrust
        let thrustForce = 0;
        if (state.engineRunning) {
            // Simplified thrust calculation based on power and RPM
            // Thrust = Power / Velocity (simplified, capped at a static max thrust)
            const maxStaticThrust = this.config.maxPower / 30; // Rough approximation

            // Apply throttle
            const currentThrust = maxStaticThrust * controls.throttle;
            thrustForce = currentThrust;

            state.rpm = this.config.idleRpm + (this.config.maxRpm - this.config.idleRpm) * controls.throttle;
        } else {
            state.rpm = Math.max(0, state.rpm - 1000 * dt); // Spool down
        }

        // 3. Aerodynamics (Lift and Drag)
        // Lift = 0.5 * density * velocity^2 * wingArea * CL
        let liftForce = 0;
        let dragForce = 0;

        // Angle of Attack (AoA) estimation - simplified
        // Angle between forward vector and velocity vector
        let aoa = 0;
        if (forwardSpeed > 5) {
            // If Local Y velocity is negative (moving down relative to body), 
            // the air hits the bottom of the wing -> Positive AoA
            aoa = Math.atan2(-velLocal.y, Math.max(0.1, forwardSpeed));
        }
        state.aoa = aoa;

        if (forwardSpeed > 2) {
            // Parasitic Drag
            const dragCoeff = 0.03 + (aoa * aoa * 0.1); // Drag increases rapidly with AoA
            dragForce = 0.5 * this.airDensity * (forwardSpeed * forwardSpeed) * this.config.wingArea * dragCoeff;

            // Lift
            // Simple linear CL with stall drop-off
            let cl = aoa * 5.0 + 0.2; // Base lift + AoA lift

            // Stall logic
            this.gameState.flags.stallWarning = false;
            this.gameState.flags.isStalled = false;

            const stallAngle = 0.25; // ~14 degrees
            if (aoa > stallAngle - 0.05) this.gameState.flags.stallWarning = true;
            if (aoa > stallAngle) {
                this.gameState.flags.isStalled = true;
                cl = cl * 0.5; // Lift drops off dramatically
                dragForce *= 2.0; // Drag spikes
            }

            // Ensure lift isn't negative simply because we are pointing down 
            // (real wings generate some negative lift, but simplified here)
            liftForce = Math.max(0, 0.5 * this.airDensity * (forwardSpeed * forwardSpeed) * this.config.wingArea * cl);
        }

        state.lift = liftForce;

        // 4. Ground interaction
        let groundNormalForce = 0;
        let wheelFriction = 0;
        const terrainHeight = this.gameState.world.terrainHeight;

        // Check if on ground (Aircraft model 0,0,0 is at lowest wheel)
        if (pos.y <= terrainHeight + 0.1) {
            pos.y = terrainHeight;

            // Cancel downward velocity
            if (velGlobal.y < 0) {
                // Crash detection
                if (velGlobal.y < -10) { // arbitrary crash threshold (approx -2000 fpm)
                    this.gameState.flags.isCrashed = true;
                    console.log("CRASH: Excessive sink rate");
                    return;
                }
                velGlobal.y = 0;
            }

            // We are on the ground.
            // Simplified ground forces: 
            // 1. the ground pushes up to counter gravity and remaining lift.
            const weightForce = this.config.mass * this.gravity;
            groundNormalForce = Math.max(0, weightForce - (liftForce * Math.cos(state.rotation.roll)));

            // 2. Rolling friction
            const frictionCoef = controls.wheelBrake ? 0.8 : 0.05;
            wheelFriction = groundNormalForce * frictionCoef;

            // Prevent sliding sideways on ground
            velLocal.x *= 0.8;
            velGlobal.copy(velLocal).applyQuaternion(quat);

            // Tricycle gear: Prevent nose from digging into ground (negative pitch)
            // But allow nose to lift up (positive pitch) for takeoff rotation
            // Only damp the angular velocity here; the actual rotation clamping is done
            // after quaternion decomposition so it isn't overwritten.
            if (state.rotation.pitch < 0) {
                if (this.angularVelocity.x < 0) this.angularVelocity.x *= 0.5;
            }

            // Roll is restricted while firmly on the wheels
            if (groundNormalForce > weightForce * 0.1) {
                this.angularVelocity.z *= 0.5;
            }
        }

        // 5. Accumulate Local Forces
        // Wheel friction always opposes motion along the Z axis
        // Since forward is -Z, if velLocal.z < 0 (moving forward), friction must be positive (+Z = backward)
        // If velLocal.z > 0 (moving backward), friction must be negative (-Z = forward)
        const frictionZ = velLocal.z < 0 ? wheelFriction : -wheelFriction;
        const totalLocalForce = new THREE.Vector3(
            -velLocal.x * 100, // Side friction (simplify fuselage drag sideways)
            liftForce + groundNormalForce, // Up
            -thrustForce + dragForce + frictionZ // Back/Forward. (-Z is forward)
        );

        // Convert forces to global acceleration
        const globalForce = totalLocalForce.clone().applyQuaternion(quat);
        // Add gravity downwards
        globalForce.y -= (this.config.mass * this.gravity);

        const globalAccel = globalForce.divideScalar(this.config.mass);

        // Update global velocity
        velGlobal.add(globalAccel.multiplyScalar(dt));

        // 6. Angular Physics (Torques mapping from controls)
        // The faster we go, the more control authority we have (up to a point)
        const controlAuthority = Math.min(1.0, Math.max(0.1, forwardSpeed / 40.0));

        // Apply inputs to angular velocity target
        // Pitch mapping: W/S controls elevator
        const pitchTorque = controls.pitch * 2.0 * controlAuthority;
        // Roll mapping: A/D controls ailerons
        const rollTorque = controls.roll * 3.0 * controlAuthority;
        // Yaw mapping: Q/E controls rudder. On ground, controls nose wheel steering
        let yawTorque = controls.yaw * 1.5 * controlAuthority;

        if (pos.y <= terrainHeight + 0.1) {
            // Ground steering authority increases at low speeds, but drops off a bit at high speeds
            yawTorque = controls.yaw * 1.5 * Math.max(0.2, 1.0 - (forwardSpeed / 80.0));

            // Natural tendency for nose heavy plane to drop nose on ground
            if (controls.pitch <= 0) {
                this.angularVelocity.x -= 0.5 * dt;
            }
        }

        // Add damping (air resistance resisting rotation)
        const damping = 0.95;
        this.angularVelocity.x = (this.angularVelocity.x + pitchTorque * dt) * damping;
        this.angularVelocity.y = (this.angularVelocity.y + yawTorque * dt) * damping;
        this.angularVelocity.z = (this.angularVelocity.z + rollTorque * dt) * damping;

        // Apply angular velocity as LOCAL-space rotations via quaternion composition.
        // Mutating Euler angles directly would rotate in world space, meaning pitching while
        // banked would tilt relative to the world horizon rather than the aircraft's wing axis.
        // By composing quat * deltaQuat (local), all control inputs rotate around the
        // aircraft's own body axes, so banked pitch correctly arcs the nose around the horizon.
        const deltaQuat = new THREE.Quaternion(
            this.angularVelocity.x * dt * 0.5, // local pitch axis (body X)
            this.angularVelocity.y * dt * 0.5, // local yaw axis   (body Y)
            this.angularVelocity.z * dt * 0.5, // local roll axis  (body Z)
            1.0
        ).normalize();
        // Multiply on the RIGHT so the delta is in the aircraft's local frame
        quat.multiply(deltaQuat).normalize();
        // Decompose back to Euler so the rest of the code (instruments, camera, etc.) still works
        const newEuler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
        state.rotation.pitch = newEuler.x;
        state.heading = -newEuler.y; // GameState heading is positive=clockwise; Euler Y is CCW
        state.rotation.roll  = newEuler.z;

        // Ground rotation constraints — applied after decomposition so they aren't overwritten
        if (pos.y <= terrainHeight + 0.1) {
            // Tricycle gear: clamp nose-down pitch while on the ground
            if (state.rotation.pitch < 0) {
                state.rotation.pitch *= 0.8;
            }
            // Clamp roll while weight is on the wheels
            const weightForcePost = this.config.mass * this.gravity;
            if (groundNormalForce > weightForcePost * 0.1) {
                state.rotation.roll *= 0.8;
            }
        }

        // Write turn rate and slip to GameState for instruments
        state.turnRate = this.angularVelocity.y; // yaw rate (rad/s)
        state.slip = velLocal.x / Math.max(1, forwardSpeed); // lateral velocity as fraction of forward speed

        // Maintain heading in 0-2PI range
        if (state.heading > Math.PI * 2) state.heading -= Math.PI * 2;
        if (state.heading < 0) state.heading += Math.PI * 2;

        // 7. Update GameState with new values
        pos.add(velGlobal.clone().multiplyScalar(dt));

        state.position.x = pos.x;
        state.position.y = pos.y;
        state.position.z = pos.z;

        state.velocity.x = velGlobal.x;
        state.velocity.y = velGlobal.y;
        state.velocity.z = velGlobal.z;

        state.altitude = pos.y;
        state.verticalSpeed = velGlobal.y;
    }
}
