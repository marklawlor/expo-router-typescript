import { Text } from "react-native";

type RouteProps<T> = {
  route: {
    params: T;
  };
};

interface PageParams {
  ids: string[];
}

export default function BlogPost({ route }: RouteProps<PageParams>) {
  return <Text>{route.params.id}</Text>;
}
