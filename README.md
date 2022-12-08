# expo-router-typescript

Experimental Typescript support for Expo Router

```tsx
// app/[id].ts
import { Text } from "react-native";

type RouteProps<T> = {
  route: {
    params: T;
  };
};

interface PageParams {
  id2: string; // <--- Wrong parameter 
}

export default function BlogPost({ route }: RouteProps<PageParams>) {
                                                    // ^? Missing "id" from route params.ts(72001)
  return <Text>{route.params.id}</Text>;
}
```