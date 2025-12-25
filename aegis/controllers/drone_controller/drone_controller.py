"""
AEGIS Swarm Drone Controller
Controls a Mavic 2 Pro in Webots for Autonomous SAR Operations.
"""

from controller import Robot
import math

# --- Constants ---
k_vertical_thrust = 68.5  # Vertical thrust base
k_vertical_offset = 0.6   # Gravity compensation
k_vertical_p = 3.0        # PID constants for Altitude
k_roll_p = 50.0           # PID constants for Roll
k_pitch_p = 30.0          # PID constants for Pitch

# Search State Definitions
TAKEOFF = 0
SEARCH = 1
INVESTIGATE = 2

class AegisDrone (Robot):
    def __init__(self):
        super(AegisDrone, self).__init__()
        
        self.timestep = int(self.getBasicTimeStep())
        self.state = TAKEOFF
        
        # --- Device Initialization ---
        self.camera = self.getDevice('camera')
        self.camera.enable(self.timestep)
        
        self.imu = self.getDevice('inertial unit')
        self.imu.enable(self.timestep)
        
        self.gps = self.getDevice('gps')
        self.gps.enable(self.timestep)
        
        self.gyro = self.getDevice('gyro')
        self.gyro.enable(self.timestep)
        
        self.compass = self.getDevice('compass')
        self.compass.enable(self.timestep)

        # --- Motor Initialization ---
        self.motors = []
        motor_names = ['front left propeller', 'front right propeller', 'rear right propeller', 'rear left propeller']
        for name in motor_names:
            motor = self.getDevice(name)
            motor.setPosition(float('inf')) # Velocity control mode
            motor.setVelocity(1.0)
            self.motors.append(motor)

        # --- Mission Variables ---
        self.target_altitude = 2.0  # Meters
        self.search_waypoints = [
            [0, 0], [10, 10], [10, -10], [-10, -10], [-10, 10]
        ]
        self.current_waypoint_index = 0
    def pulse_leds(self, is_detecting):
        """Pulsates the front LEDs when a target is localized."""
        if not hasattr(self, 'led_val'): self.led_val = 0
        if not hasattr(self, 'led_dir'): self.led_dir = 1
        
        led_front_left = self.getDevice('front left led')
        led_front_right = self.getDevice('front right led')

        if is_detecting:
            # Create a breathing pulse effect
            self.led_val += 0.05 * self.led_dir
            if self.led_val >= 1.0 or self.led_val <= 0.0:
                self.led_dir *= -1
            led_front_left.set(1 if self.led_val > 0.5 else 0)
            led_front_right.set(1 if self.led_val > 0.5 else 0)
        else:
            # Constant blue/green for standard search
            led_front_left.set(0)
            led_front_right.set(0)

    def run(self):
        print(f"AEGIS UNIT {self.getName()} ONLINE. SYSTEM CHECK COMPLETE.")
        
        while self.step(self.timestep) != -1:
            # 1. READ SENSORS
            roll = self.imu.getRollPitchYaw()[0]
            pitch = self.imu.getRollPitchYaw()[1]
            yaw = self.imu.getRollPitchYaw()[2]
            
            altitude = self.gps.getValues()[2]
            pos_x = self.gps.getValues()[0]
            pos_y = self.gps.getValues()[1]
            
            roll_acceleration = self.gyro.getValues()[0]
            pitch_acceleration = self.gyro.getValues()[1]
            is_near_target = False
            # Example coordinates for SIG-P1 from your world file
            if math.sqrt((pos_x - 15)**2 + (pos_y - 15)**2) < 5.0:
                is_near_target = True
                if self.state != INVESTIGATE:
                    print(f"TACTICAL ALERT: {self.getName()} Localized Signal SIG-P1")
                    self.state = INVESTIGATE

            self.pulse_leds(is_near_target)

            # 2. STATE MACHINE
            
            # --- STATE: TAKEOFF ---
            if self.state == TAKEOFF:
                if altitude > self.target_altitude - 0.2:
                    print(f"{self.getName()}: Altitude Reached. Engaging Search Pattern.")
                    self.state = SEARCH

            # --- STATE: SEARCH ---
            roll_disturbance = 0.0
            pitch_disturbance = 0.0
            yaw_disturbance = 0.0
            
            if self.state == SEARCH:
                # Simple logic to move toward current waypoint
                target_x = self.search_waypoints[self.current_waypoint_index][0]
                target_y = self.search_waypoints[self.current_waypoint_index][1]
                
                # Calculate vector to target
                dx = target_x - pos_x
                dy = target_y - pos_y
                distance = math.sqrt(dx*dx + dy*dy)
                
                # If close enough, switch to next waypoint
                if distance < 1.0:
                    print(f"{self.getName()}: Waypoint {self.current_waypoint_index} Reached.")
                    self.current_waypoint_index = (self.current_waypoint_index + 1) % len(self.search_waypoints)
                
                # Calculate desired pitch/roll to move toward target
                # (Simplified movement logic for demo purposes)
                # Rotate dx/dy by yaw to get body-relative coordinates
                cos_yaw = math.cos(yaw)
                sin_yaw = math.sin(yaw)
                
                body_x = dx * cos_yaw + dy * sin_yaw
                body_y = -dx * sin_yaw + dy * cos_yaw
                
                # Tilt drone to move
                pitch_disturbance = -math.copysign(min(abs(body_x), 1.0), body_x) * 0.5
                roll_disturbance = -math.copysign(min(abs(body_y), 1.0), body_y) * 0.5


            # 3. PID CONTROL MIXING
            
            # Vertical Control (Altitude)
            clamped_altitude = max(altitude + roll + pitch, 0.0) # Compensation for tilt
            vertical_input = k_vertical_p * pow(self.target_altitude - clamped_altitude, 3.0)
            
            # Roll Control
            roll_input = k_roll_p * clamped_altitude + roll_acceleration + roll_disturbance
            
            # Pitch Control
            pitch_input = k_pitch_p * clamped_altitude + pitch_acceleration + pitch_disturbance
            
            # Yaw Control (keep mostly stable)
            yaw_input = yaw_disturbance

            # 4. MOTOR OUTPUT
            # Mix the PID inputs to the 4 motors
            front_left  = k_vertical_thrust + vertical_input - roll_input - pitch_input + yaw_input
            front_right = k_vertical_thrust + vertical_input + roll_input - pitch_input - yaw_input
            rear_right  = k_vertical_thrust + vertical_input + roll_input + pitch_input + yaw_input
            rear_left   = k_vertical_thrust + vertical_input - roll_input + pitch_input - yaw_input
            
            self.motors[0].setVelocity(rear_right + k_vertical_offset)
            self.motors[1].setVelocity(front_right - k_vertical_offset)
            self.motors[2].setVelocity(front_left + k_vertical_offset)
            self.motors[3].setVelocity(rear_left - k_vertical_offset)
            
            # 5. DATA STREAM (Mocking the WebSocket Send)
            # This is where you would send `pos_x`, `pos_y`, and `altitude` 
            # to your React App to update the "Tactical Map" in real-time.
            # Example: websocket.send(json.dumps({'id': self.getName(), 'x': pos_x, 'y': pos_y}))

# Initialize and Run
controller = AegisDrone()
controller.run()