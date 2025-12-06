import { createEvent, createStore, sample } from "effector";
import { Dialog, Input, Button, Stack, HStack } from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import { useState } from "react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => void;
  title?: string;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  currentName,
  onConfirm,
  title = "Rename",
}: RenameDialogProps) => {
  const [name, setName] = useState(currentName);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body>
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                }}
              />
            </Field.Root>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack justify="flex-end" gap={2}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button colorPalette="blue" onClick={handleConfirm} disabled={!name.trim()}>
                Confirm
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

