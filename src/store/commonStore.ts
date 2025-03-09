import { defineStore } from "pinia";
import { ref } from "vue";

export const useCommonStore = defineStore("common", () => {

    const dissolveOn = ref<boolean>(false);

    return { dissolveOn };
});
