// src/ErrorBoundary.tsx
import { Box, Text } from '@chakra-ui/react';
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러를 로깅 서비스에 기록할 수 있습니다.
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 폴백 UI 커스터마이징
      return (
        <Box textAlign="center" mt="20">
          <Text fontSize="xl" color="red.500">
            문제가 발생했습니다.
          </Text>
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
