const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt=require("jsonwebtoken")

// MongoDB Connection URL
const mongoURI = 'mongodb+srv://kaschostel4:sivasankar@kaschostelcluster0.nopfs.mongodb.net/studentform';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the Student Schema
const studentSchema = new mongoose.Schema({
    name: String,
    regNo: String,
    courseYear: String,
    educationType: String,
    course: String,
    dob: Date,
    gender: String,
    studentPhone: String,
    studentEmail: String,
    roomNo: String,
    nativePlace: String,
    address: String,
    religion: String,
    caste: String,
    nationality: String,
    bloodgroup: String,
    motherName: String,
    fatherName: String,
    parentsno: String,
    accountNo: String,
    accountHolder: String,
    ifsc: String,
    branch: String,
    username: String,
    password: String,
    photo: String 
});

// Create the model
const Student = mongoose.model('Student', studentSchema);

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory for storing uploaded photos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });

// Define API endpoint to handle form submission with file upload


const verifyToken = (req, res, next) => {
    try {
    
      const authHeader = req.header("Authorization");
      if (!authHeader) {
        return res.status(401).json({ message: "Token required" });
      }
  
      const token = authHeader.split(" ")[1];
  
        if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
  
       
      const decode = jwt.verify(token, "Secret_key");
     
      req.user = decode;
      next();
     
      
     
     
    } catch (err) {
       if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      } else {
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  };









app.post('/register', upload.single('photo'), async (req, res) => {
    try {
        const studentData = req.body;
        const photoPath = req.file ? req.file.path : null; // Get the photo path

        // Create a new student record
        const newStudent = new Student({
            ...studentData,
            photo: photoPath // Save the photo path in the database
        });

        // Save to the database
        await newStudent.save();

        res.status(200).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error while registering student:', error);
        res.status(500).json({ message: 'Error occurred during registration' });
    }
});


app.post("/login",async(req,res)=>{
    const {username,password}=req.body
    const response=await Student.findOne({username})
    console.log(response)
    if(!response){
        return res.status(404).json({message:"user not found"})
    }
        if(response.password==password){
          const token=jwt.sign({User:username,Id:response._id},"Secret_key",{expiresIn:"3h"})
          res.json({token})
        }  
    else{
        res.status(404).json({message:"Password Incorrect"})
    }
})

// Define API endpoint to fetch all students
app.get('/students', verifyToken,async (req, res) => {
    try {
        const students = await Student.find(); // Fetch all student records
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error occurred while fetching students' });
    }
});

// Define API endpoint to fetch a single student by ID
app.get('/student',verifyToken, async (req, res) => {
    try {
        const username=req.user.User
        const student = await Student.findOne({username}); // Fetch the student by ID
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Error occurred while fetching student' });
    }
});

// Define API endpoint to update student details by ID
app.put('/students', verifyToken,async (req, res) => {
    const studentId = req.user.Id; // Get student ID from URL params
    const {address,studentPhone,course} = req.body;    // Get updated data from request body
    console.log(address)
    try {
        // Find student by ID and update with the new data
        const updatedStudent = await Student.findByIdAndUpdate(studentId, {address,studentPhone,course} , { new: true });

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Error updating student' });
    }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// DELETE endpoint for deleting students by course year
app.delete('/students/delete', async (req, res) => {
    const year = req.query.year; // Get the year from query parameters
    try {
        // Delete students with the matching courseYear
        const result = await Student.deleteMany({ courseYear: year });
        
        // Check if any documents were deleted
        if (result.deletedCount > 0) {
            res.status(200).send({ message: `${result.deletedCount} students deleted successfully.` });
        } else {
            res.status(404).send({ message: 'No students found for the specified year.' });
        }
    } catch (error) {
        console.error('Error deleting students:', error);
        res.status(500).send({ message: 'Failed to delete students.' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
