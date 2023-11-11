import { VStack, Card, Box, HStack, Button, Heading, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import EmojiIcon from "../EmojiIcon";
import { Activity, useActivities } from "../../controllers/activities";

const ActivitiesView = () => {
    const { data: activities, isLoading } = useActivities();

    return (
        <VStack background="orange.100" height="100%" alignItems="stretch" spacing="0">
            <Box padding="4" flex="1" overflowY="auto">
                <Heading fontSize="xl" paddingTop="5">
                    What are we doing today?
                </Heading>
                <Text fontSize="m" paddingBottom="4">
                    Here are your friends' suggestions
                </Text>
                {isLoading && <Text>Loading...</Text>}
                {activities && (
                    <VStack spacing={4} align="stretch">
                        {activities.map(a => (
                            <Suggestion activity={a} key={a.id} />
                        ))}
                    </VStack>
                )}
            </Box>
            <Box background="white" padding="3" textAlign="center" boxShadow="0 0 1rem rgba(0,0,0,0.3)" z-index="100" position="relative">
                <Button colorScheme="blue">Add new suggestion</Button>
            </Box>
        </VStack>
    );
};

const Suggestion = (props: { activity: Activity }) => {
    const { id, name, owner, votes } = props.activity;
    return (
        <Link to={`/activities/${id}`}>
            <Card padding={2}>
                <HStack>
                    <EmojiIcon>⚽</EmojiIcon>
                    <VStack flex="1" alignItems="right" justifyContent="center" spacing={0}>
                        <Text fontSize="1rem">{name}</Text>
                        <Text fontSize="0.6rem" color="#555555">
                            {owner}
                        </Text>
                    </VStack>
                    <Text fontSize="0.6rem" color="#555555" alignSelf="start" padding={1}>
                        34 min ago
                    </Text>
                </HStack>
                <HStack spacing={1} marginTop="1rem" flexWrap="wrap">
                    {votes.map(({ emoji, count }) => (
                        <Button size="xs" variant="outline" key={emoji} paddingRight={3} borderRadius="full">
                            {emoji} {count}
                        </Button>
                    ))}
                    <Box flex="1"></Box>
                    <Button size="xs" colorScheme="blue">
                        Open
                    </Button>
                </HStack>
            </Card>
        </Link>
    );
};

export default ActivitiesView;
