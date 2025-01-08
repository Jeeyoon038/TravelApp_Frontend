import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  Center,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { useState } from "react";

interface AddGroupMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (googleEmail: string) => Promise<void>;
}

const AddGroupMemberModal = ({
  isOpen,
  onClose,
  onAddMember,
}: AddGroupMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleAddMember = async () => {
    if (!email.endsWith("@gmail.com")) {
      toast({
        title: "유효하지 않은 이메일",
        description: "Google 이메일(gmail.com) 형식만 초대 가능합니다.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddMember(email);
      toast({
        title: "초대 성공",
        description: `${email} 주소로 초대가 전송되었습니다.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setEmail("");
    } catch (error) {
      toast({
        title: "초대 실패",
        description: "멤버 초대 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader textAlign="center">그룹 친구 초대</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box>
            <Text mb={4} textAlign="center">
              친구의 Google Email을 입력해주세요.
            </Text>
            <Center>
              <FormControl w="80%">
                <Input
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
            </Center>
            <Flex justifyContent="flex-end" mt={6}>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={handleAddMember}
                isLoading={isSubmitting}
              >
                멤버 추가
              </Button>
              <Button onClick={onClose}>취소</Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddGroupMemberModal;