import { Avatar, Center, HStack, Text } from 'native-base';

export interface ParticipantProps {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
  };
};

interface Props {
  participant: ParticipantProps[];
  count: number;
};

export function Participants({participant, count }: Props) {
  return (
    <HStack>
      {
        participant && participant.map((participants) => (
          <Avatar
            key={participants.id}
            source={{ uri: participants.user.avatarUrl}}
            w={8}
            h={8}
            rounded="full"
            borderWidth={2}
            marginRight={-3}
            borderColor="gray.800"
          >
           {participants.user?.name?.at(0).toUpperCase()}
          </Avatar>
        ))
      }

      <Center w={8} h={8} bgColor="gray.700" rounded="full" borderWidth={1} borderColor="gray.800">
        <Text color="gray.100" fontSize="xs" fontFamily="medium">
          {count ? `+${count}` : 0}
        </Text>
      </Center>
    </HStack>
  );
}