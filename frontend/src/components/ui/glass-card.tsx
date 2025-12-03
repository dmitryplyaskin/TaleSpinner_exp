import { Box, type BoxProps } from "@chakra-ui/react";
import { forwardRef } from "react";

export const GlassCard = forwardRef<HTMLDivElement, BoxProps>(
  function GlassCard(props, ref) {
    return (
      <Box
        ref={ref}
        bg="bg.canvas/60" // 60% opacity of canvas background
        backdropFilter="blur(10px)"
        borderRadius="2xl"
        boxShadow="glass"
        border="1px solid"
        borderColor="border.subtle"
        {...props}
      />
    );
  }
);
