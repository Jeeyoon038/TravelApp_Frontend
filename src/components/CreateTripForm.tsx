import React, { useState } from 'react';
import { Box, Input, Button, FormLabel, FormControl, Select } from '@chakra-ui/react';
import sendTripToBackend from '../utils/tripUploader';

const CreateTripForm = () => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState(''); // Group ID 선택

  const handleSubmit = async () => {
    const tripData = {
      groupId,  // 선택한 groupId  // Add tripId here
      title,
      startDate,
      endDate,
    };

    const result = await sendTripToBackend(tripData);  // sendTripToBackend 함수 호출

    if (result) {
      console.log("Trip created successfully:", result);
      // 성공적인 응답 처리 (예: 알림, 리다이렉션 등)
    } else {
      console.error("Failed to create trip");
    }
  };

  return (
    <Box p={4}>
      <FormControl id="groupId" mb={4}>
        <FormLabel>Group ID</FormLabel>
        <Select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Select Group"
        >
          <option value="1">Group 1</option>
          <option value="2">Group 2</option>
          <option value="3">Group 3</option>
          {/* 여기에 실제 그룹 ID를 넣으면 됩니다. */}
        </Select>
      </FormControl>

      <FormControl id="title" mb={4}>
        <FormLabel>Title</FormLabel>
        <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>

      <FormControl id="startDate" mb={4}>
        <FormLabel>Start Date</FormLabel>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </FormControl>

      <FormControl id="endDate" mb={4}>
        <FormLabel>End Date</FormLabel>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </FormControl>

      <Button onClick={handleSubmit}>Create Trip</Button>
    </Box>
  );
};

export default CreateTripForm;
