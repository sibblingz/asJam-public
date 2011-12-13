try{throw new Error()}catch(e){if(e instanceof Error){baz()}else{throw e}}try{throw new Error()}catch(e){if(e instanceof TypeError){foo()}else if(e instanceof Error){bar()}else{throw e}}
