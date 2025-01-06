//CreateTripModal.tsx
import React, { ChangeEvent, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Button
} from "@chakra-ui/react";
import axios from 'axios';
import AWS from 'aws-sdk';


AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});


const S3_BUCKET = process.env.REACT_APP_S3_BUCKET_NAME;

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    start_date: string;
    end_date: string;
    files: File[];
  }) => Promise<void>;
}

export default function CreateTripModal({ 
  isOpen, 
  onClose, 
  onCreateTrip 
}: CreateTripModalProps) {
  const [newTrip, setNewTrip] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };


  const uploadToS3 = async (file:File) => {
    const s3 = new AWS.S3();
    if (!S3_BUCKET) {
      throw new Error('S3 bucket name is not defined');
    }

    const params = {
      Bucket: S3_BUCKET as string,
      Key: `uploads/${Date.now()}-${file.name}`,  // Unique filename
      Body: file,
      ACL: 'public-read',  // Make the file publicly readable
      ContentType: file.type,  // Set MIME type
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location;  // Return the URL of the uploaded file
    } catch (err) {
      console.error('Error uploading to S3:', err);
      throw new Error('Error uploading file to S3');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      console.log("No file selected");
      return;
    }

    try {
      // Upload each file to S3 and collect their URLs
      const fileUrls = await Promise.all(selectedFiles.map(file => uploadToS3(file)));

      // Prepare trip data
      const tripData = {
        ...newTrip,
        files: fileUrls,  // Send the URLs to the backend
      };

      // Send trip data to the backend
      await axios.post('http://localhost:3000/trips', tripData);

      setNewTrip({
        title: "",
        start_date: "",
        end_date: "",
      });
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Trip</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <FormControl mb={4}>
              <FormLabel>Trip Title</FormLabel>
              <Input
                name="title"
                placeholder="Enter trip title"
                value={newTrip.title}
                onChange={handleInputChange}
                required
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Images</FormLabel>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Start Date</FormLabel>
              <Input
                name="start_date"
                type="date"
                value={newTrip.start_date}
                onChange={handleInputChange}
                required
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>End Date</FormLabel>
              <Input
                name="end_date"
                type="date"
                value={newTrip.end_date}
                onChange={handleInputChange}
                required
              />
            </FormControl>
            <Button colorScheme="blue" mr={3} type="submit">
              Create Trip
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
