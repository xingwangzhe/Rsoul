<template>
    <NormalToolbar title="mark" @onClick="handler">
        <BookMarked class="md-editor-icon" />
    </NormalToolbar>
</template>

<script setup>
import { NormalToolbar } from "md-editor-v3";
import { BookMarked } from "lucide-vue-next";
const handler = () => {
    console.log("NormalToolbar clicked!");
};
</script>
